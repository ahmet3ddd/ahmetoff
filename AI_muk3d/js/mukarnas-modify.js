// Mukarnas duzenleme modu (global - file:// uyumlu)
// Port: BADEM-TAM modif.ms, mukarnas-modif-yaprak-tam.ms, mukarnas-modif-yaprak-yrm.ms
(function (global) {
    'use strict';

    function cloneMesh(mesh) {
        return {
            vertices: mesh.vertices.map(function (v) {
                return { x: v.x, y: v.y, z: v.z };
            }),
            faces: mesh.faces.map(function (f) {
                return [f[0], f[1], f[2]];
            })
        };
    }

    function segHeight(verts, topIdx, botIdx) {
        return verts[topIdx].z - verts[botIdx].z;
    }

    /**
     * Profil: olcum (0-based) + segment degisince tasinan koseler
     * MaxScript m1..m6 ve tam()/tamyaprak()/yrm() ile uyumlu
     */
    const PROFILES = {
        badem_tam: {
            mboy: [10, 1],
            mA: [9, 8], mB: [8, 6], mC: [6, 5], mD: [5, 4], mE: [4, 2], mF: [2, 1],
            move: {
                mA: [9, 10, 20, 21],
                mB: [19, 8],
                mC: [6, 7, 17, 18],
                mD: [5, 16],
                mE: [4, 15],
                mF: [13, 14, 2, 3]
            },
            clampZ: true
        },
        badem_half: {
            mboy: [9, 1],
            mA: [9, 8], mB: [8, 7], mC: [7, 5], mD: [5, 4], mE: [4, 2], mF: [2, 1],
            move: {
                mA: [9, 10],
                mB: [8],
                mC: [6, 7],
                mD: [5],
                mE: [4],
                mF: [2, 3]
            }
        },
        yaprak_tam: {
            mboy: [12, 1],
            mA: [11, 10], mB: [10, 9], mC: [9, 6], mD: [6, 4], mE: [4, 2], mF: [2, 1],
            move: {
                mA: [11, 12, 18],
                mB: [10],
                mC: [9, 8, 17],
                mD: [6, 7, 16],
                mE: [4, 5, 15],
                mF: [2, 3, 13]
            }
        },
        yaprak_half: {
            mboy: [12, 1],
            mA: [11, 10], mB: [10, 9], mC: [9, 6], mD: [6, 4], mE: [4, 2], mF: [2, 1],
            move: {
                mA: [11, 12],
                mB: [8, 9],
                mC: [6, 7],
                mD: [4, 5],
                mE: [4],
                mF: [2, 3]
            }
        },
        fitil_tam: {
            mboy: [13, 0],
            mA: [13, 9], mB: [9, 7], mC: [7, 5], mD: [5, 3], mE: [3, 1], mF: [1, 0],
            halfCount: 14,
            move: {
                mA: [12, 13, 26, 27],
                mB: [9, 11, 23, 25],
                mC: [7, 8, 10, 21, 22, 24],
                mD: [5, 6, 19, 20],
                mE: [3, 4, 17, 18],
                mF: [1, 2, 15, 16]
            }
        },
        fitil_half: {
            mboy: [13, 0],
            mA: [13, 9], mB: [9, 7], mC: [7, 5], mD: [5, 3], mE: [3, 1], mF: [1, 0],
            move: {
                mA: [12, 13],
                mB: [9, 11],
                mC: [7, 8, 10],
                mD: [5, 6],
                mE: [3, 4],
                mF: [1, 2]
            }
        },
        kaz_tam: {
            mboy: [12, 0],
            mA: [12, 10], mB: [10, 8], mC: [8, 6], mD: [6, 4], mE: [4, 2], mF: [2, 0],
            halfCount: 13,
            move: {
                mA: [11, 12, 24, 25],
                mB: [9, 10, 22, 23],
                mC: [7, 8, 20, 21],
                mD: [5, 6, 18, 19],
                mE: [3, 4, 16, 17],
                mF: [1, 2, 14, 15]
            }
        },
        kaz_half: {
            mboy: [12, 0],
            mA: [12, 10], mB: [10, 8], mC: [8, 6], mD: [6, 4], mE: [4, 2], mF: [2, 0],
            move: {
                mA: [11, 12],
                mB: [9, 10],
                mC: [7, 8],
                mD: [5, 6],
                mE: [3, 4],
                mF: [1, 2]
            }
        }
    };

    const SEG_KEYS = ['mA', 'mB', 'mC', 'mD', 'mE', 'mF'];

    function profileKey(type, variant) {
        if (variant === 'tam-asym') return type + '_tam';
        const half = (variant === 'sol' || variant === 'sag');
        return type + (half ? '_half' : '_tam');
    }

    function getProfile(type, variant) {
        return PROFILES[profileKey(type, variant)] || null;
    }

    function remapIndex(vertexRemap, idx) {
        return vertexRemap[idx];
    }

    function remapIndexList(vertexRemap, indices) {
        const seen = Object.create(null);
        const out = [];
        for (let i = 0; i < indices.length; i++) {
            const n = remapIndex(vertexRemap, indices[i]);
            if (seen[n] === undefined) {
                seen[n] = true;
                out.push(n);
            }
        }
        return out;
    }

    /** Kaynak profili birlestirilmis mesh indekslerine cevir */
    function remapProfile(profile, vertexRemap) {
        if (!profile || !vertexRemap) return profile;

        const out = {
            clampZ: profile.clampZ,
            halfCount: profile.halfCount,
            mboy: [
                remapIndex(vertexRemap, profile.mboy[0]),
                remapIndex(vertexRemap, profile.mboy[1])
            ],
            move: {}
        };

        for (let i = 0; i < SEG_KEYS.length; i++) {
            const key = SEG_KEYS[i];
            const pair = profile[key];
            out[key] = [
                remapIndex(vertexRemap, pair[0]),
                remapIndex(vertexRemap, pair[1])
            ];
            out.move[key] = remapIndexList(vertexRemap, profile.move[key]);
        }

        return out;
    }

    function resolveProfile(type, variant, vertexRemap) {
        const base = getProfile(type, variant);
        if (!base) return null;
        if (!vertexRemap) return base;
        return remapProfile(base, vertexRemap);
    }

    function measureSegments(verts, profile) {
        const out = { mboy: 0 };
        out.mboy = segHeight(verts, profile.mboy[0], profile.mboy[1]);
        for (let i = 0; i < SEG_KEYS.length; i++) {
            const k = SEG_KEYS[i];
            const pair = profile[k];
            out[k] = segHeight(verts, pair[0], pair[1]);
        }
        return out;
    }

    function initModifyState(result, type, variant) {
        if (!result || !result.mesh) return null;
        const profile = resolveProfile(type, variant, result.vertexRemap);
        if (!profile) return null;

        const base = cloneMesh(result.mesh);
        const segments = measureSegments(base.vertices, profile);
        return {
            profile: profile,
            snapshot: cloneMesh(base),
            segments: segments,
            boyMode: 'height',
            boyValue: segments.mboy,
            baseMboy: segments.mboy,
            boyBaseSnapshot: null
        };
    }

    function getSegmentCeilingZ(profile, segKey, move, snap) {
        const segIndex = SEG_KEYS.indexOf(segKey);
        if (segIndex <= 0) {
            return Infinity;
        }
        let idx = segIndex;
        while (idx > 0) {
            idx--;
            const aboveTopIdx = profile[SEG_KEYS[idx]][0];
            if (move.indexOf(aboveTopIdx) === -1) {
                return snap[aboveTopIdx].z;
            }
        }
        return Infinity;
    }

    function clampMovedVertices(profile, segKey, move, snap, verts) {
        if (!profile.clampZ) return;

        const floorZ = snap[profile[segKey][1]].z;
        const ceilingZ = getSegmentCeilingZ(profile, segKey, move, snap);

        for (let i = 0; i < move.length; i++) {
            const idx = move[i];
            let z = verts[idx].z;
            if (z < floorZ) z = floorZ;
            if (z > ceilingZ) z = ceilingZ;
            verts[idx] = { x: verts[idx].x, y: verts[idx].y, z: z };
        }
    }

    function applySegmentEdit(state, segKey, newValue) {
        if (!state || !state.snapshot) return null;

        const profile = state.profile;
        const move = profile.move[segKey];
        if (!move) return null;

        const oldVal = state.segments[segKey];
        const delta = oldVal - newValue;
        const snap = state.snapshot.vertices;
        const verts = snap.map(function (v) {
            return { x: v.x, y: v.y, z: v.z };
        });

        for (let i = 0; i < move.length; i++) {
            const idx = move[i];
            verts[idx] = {
                x: snap[idx].x,
                y: snap[idx].y,
                z: snap[idx].z - delta
            };
        }

        clampMovedVertices(profile, segKey, move, snap, verts);

        state.snapshot = { vertices: verts, faces: state.snapshot.faces.slice() };
        state.boyBaseSnapshot = null;
        state.segments = measureSegments(verts, profile);
        state.boyValue = state.segments.mboy;
        state.baseMboy = state.segments.mboy;

        return cloneMesh(state.snapshot);
    }

    function applyBoyScale(state, boyValue, boyMode) {
        if (!state || !state.snapshot) return null;

        const profile = state.profile;
        if (!state.boyBaseSnapshot) {
            state.boyBaseSnapshot = cloneMesh(state.snapshot);
            state.baseMboy = measureSegments(state.boyBaseSnapshot.vertices, profile).mboy;
        }

        const mboy = state.baseMboy || 1;
        let scaleFactor;
        if (boyMode === 'percent') {
            scaleFactor = boyValue / 100;
        } else {
            scaleFactor = mboy > 0 ? boyValue / mboy : 1;
        }

        const baseVerts = state.boyBaseSnapshot.vertices;
        const pivotZ = baseVerts[0].z;
        const scaled = baseVerts.map(function (v) {
            return {
                x: v.x,
                y: v.y,
                z: pivotZ + (v.z - pivotZ) * scaleFactor
            };
        });

        state.snapshot = {
            vertices: scaled,
            faces: state.snapshot.faces.slice()
        };
        state.segments = measureSegments(scaled, profile);
        if (boyMode === 'percent') {
            state.boyValue = scaleFactor * 100;
        } else {
            state.boyValue = state.segments.mboy;
        }

        return cloneMesh(state.snapshot);
    }

    function applyToResult(result, modifyState) {
        if (!modifyState || !modifyState.snapshot) return result;
        const out = Object.assign({}, result);
        out.mesh = cloneMesh(modifyState.snapshot);
        out.modified = true;
        return out;
    }

    function resetModifyState(result, type, variant) {
        return initModifyState(result, type, variant);
    }

    const SEG_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
    const SEG_COLORS = ['#e0b566', '#90c8e6', '#3aa05c', '#c0533a', '#5b8fd6', '#d6a04a'];

    /** On yuz (+Y yarim) koseleri; A-F etiketleri referans diyagramlara gore sag tarafta */
    function frontSilhouetteAtZ(frontVerts, z, zTol) {
        let best = null;
        for (let i = 0; i < frontVerts.length; i++) {
            const v = frontVerts[i];
            if (Math.abs(v.z - z) > zTol) continue;
            if (!best || v.x > best.x) best = v;
        }
        return best;
    }

    function getFrontVertices(vertices, variant) {
        const half = (variant === 'sol' || variant === 'sag');
        if (half || variant === 'tam-asym') return vertices.slice();
        const out = [];
        for (let i = 0; i < vertices.length; i++) {
            if (vertices[i].y >= -1e-4) out.push(vertices[i]);
        }
        return out.length > 0 ? out : vertices.slice();
    }

    function getSegmentMarkers(profile, vertices, options) {
        options = options || {};
        if (!profile || !vertices || vertices.length === 0) return [];

        const p3 = options.p3;
        const frontVerts = getFrontVertices(vertices, options.variant);

        let minX = Infinity;
        let maxX = -Infinity;
        for (let i = 0; i < frontVerts.length; i++) {
            const v = frontVerts[i];
            if (v.x > maxX) maxX = v.x;
            if (v.x < minX) minX = v.x;
        }
        const span = Math.max(maxX - minX, 1);

        /** p3 referansli +Y ofseti (etiket sutunu) */
        let labelX;
        let labelBaseY;
        let yOffset;
        if (p3) {
            labelX = p3.x;
            labelBaseY = p3.y;
            yOffset = Math.max(10, span * 0.1);
        } else {
            let sumY = 0;
            for (let i = 0; i < frontVerts.length; i++) sumY += frontVerts[i].y;
            labelX = frontVerts.length ? frontVerts[0].x : 0;
            labelBaseY = frontVerts.length ? sumY / frontVerts.length : 0;
            yOffset = Math.max(10, span * 0.1);
        }
        const labelY = labelBaseY + yOffset;

        const markers = [];
        for (let i = 0; i < SEG_KEYS.length; i++) {
            const key = SEG_KEYS[i];
            const pair = profile[key];
            if (!pair) continue;

            const topRef = vertices[pair[0]];
            const botRef = vertices[pair[1]];
            if (!topRef || !botRef) continue;

            const segH = topRef.z - botRef.z;
            const zTol = Math.max(segH * 0.35, 0.5);
            const topFront = frontSilhouetteAtZ(frontVerts, topRef.z, zTol) || topRef;
            const botFront = frontSilhouetteAtZ(frontVerts, botRef.z, zTol) || botRef;
            const zMid = (topRef.z + botRef.z) / 2;

            const midFront = frontSilhouetteAtZ(frontVerts, zMid, zTol) || {
                x: (topFront.x + botFront.x) / 2,
                y: (topFront.y + botFront.y) / 2,
                z: zMid
            };

            markers.push({
                key: key,
                label: SEG_LABELS[i],
                color: SEG_COLORS[i],
                top: { x: topFront.x, y: topFront.y, z: topRef.z },
                bottom: { x: botFront.x, y: botFront.y, z: botRef.z },
                mid: { x: midFront.x, y: midFront.y, z: zMid },
                labelPos: {
                    x: labelX,
                    y: labelY,
                    z: zMid
                },
                height: segH,
                topIdx: pair[0],
                bottomIdx: pair[1]
            });
        }
        return markers;
    }

    function getMoveMapOneBased(profile) {
        if (!profile || !profile.move) return {};
        const out = {};
        for (let i = 0; i < SEG_KEYS.length; i++) {
            const key = SEG_KEYS[i];
            const arr = profile.move[key];
            if (!arr) continue;
            out[SEG_LABELS[i]] = arr.map(function (idx) { return idx + 1; });
        }
        return out;
    }

    function formatMoveMap(profile) {
        const map = getMoveMapOneBased(profile);
        const lines = [];
        for (let i = 0; i < SEG_LABELS.length; i++) {
            const label = SEG_LABELS[i];
            const nums = map[label];
            if (nums && nums.length) {
                lines.push(label + ' \u2192 v' + nums.join(', v'));
            }
        }
        return lines.join('\n');
    }

    global.MukarnasModify = {
        SEG_KEYS: SEG_KEYS,
        SEG_LABELS: SEG_LABELS,
        SEG_COLORS: SEG_COLORS,
        getProfile: getProfile,
        resolveProfile: resolveProfile,
        remapProfile: remapProfile,
        getSegmentMarkers: getSegmentMarkers,
        getMoveMapOneBased: getMoveMapOneBased,
        formatMoveMap: formatMoveMap,
        initModifyState: initModifyState,
        measureSegments: measureSegments,
        applySegmentEdit: applySegmentEdit,
        applyBoyScale: applyBoyScale,
        applyToResult: applyToResult,
        resetModifyState: resetModifyState,
        cloneMesh: cloneMesh
    };
})(window);
