/**
 * 📤 Export Manager
 * Handles STL and DXF export functionality
 *
 * @author PuskulViewer
 * @version 1.0.0
 */

class ExportManager {
    /**
     * @param {PuskulViewer} viewer - Ana viewer referansı
     */
    constructor(viewer) {
        this.viewer = viewer;
        console.log('📤 ExportManager initialized');
    }

    /**
     * 📤 STL Export (Binary format)
     * @param {number|null} layerNum - Katman numarası (null ise tüm katmanlar)
     */
    exportSTL(layerNum = null) {
        try {
            console.log(`📤 STL Export başlatıldı (Layer: ${layerNum !== null ? layerNum : 'TÜM KATMANLAR'})`);

            let meshes = []; // Mesh'leri direkt topla
            let filename = 'puskul';

            if (layerNum !== null) {
                // Tek katman export
                const layer = this.viewer.layers[layerNum];
                if (!layer || !layer.mesh) {
                    window.showToast?.('Bu katman için mesh bulunamadı!', 'error');
                    return;
                }

                meshes.push(layer.mesh);

                // Köprü yüzeyleri ekle
                if (layer.bridgeMesh && Array.isArray(layer.bridgeMesh)) {
                    layer.bridgeMesh.forEach(bridge => {
                        if (bridge && bridge.geometry) {
                            meshes.push(bridge);
                        }
                    });
                }

                // Geçiş yüzeyi ekle
                if (layer.extrudeMesh && layer.extrudeMesh.geometry) {
                    meshes.push(layer.extrudeMesh);
                }

                filename = `puskul-layer-${layerNum}`;

            } else {
                // Tüm katmanlar export
                for (let lNum in this.viewer.layers) {
                    const layer = this.viewer.layers[lNum];
                    if (layer && layer.mesh) {
                        // Ana mesh
                        meshes.push(layer.mesh);

                        // Köprü yüzeyleri
                        if (layer.bridgeMesh && Array.isArray(layer.bridgeMesh)) {
                            layer.bridgeMesh.forEach(bridge => {
                                if (bridge && bridge.geometry) {
                                    meshes.push(bridge);
                                }
                            });
                        }

                        // Geçiş yüzeyi
                        if (layer.extrudeMesh && layer.extrudeMesh.geometry) {
                            meshes.push(layer.extrudeMesh);
                        }
                    }
                }

                filename = 'puskul-all-layers';
            }

            if (meshes.length === 0) {
                window.showToast?.('Export edilecek mesh bulunamadı!', 'error');
                return;
            }

            console.log(`📊 ${meshes.length} mesh export edilecek`);

            // Mesh detaylarını logla
            meshes.forEach((mesh, i) => {
                console.log(`  ${i}: ${mesh.name || 'unnamed'}, parent: ${mesh.parent ? mesh.parent.type : 'none'}, pos: (${mesh.position.x.toFixed(1)}, ${mesh.position.y.toFixed(1)}, ${mesh.position.z.toFixed(1)})`);
            });

            // Mesh'lerden transformlu geometri oluştur
            const mergedGeometry = this.mergeMeshes(meshes);

            // Ortak vertex'leri birleştir (vertex welding)
            console.log('🔧 Vertex welding başlatılıyor...');
            const weldedGeometry = this.weldVertices(mergedGeometry);

            // STL binary formatı oluştur
            const stlBinary = this.geometryToSTLBinary(weldedGeometry);

            // Dosyayı indir
            this.downloadFile(stlBinary, `${filename}.stl`, 'application/octet-stream');

            console.log(`✅ STL export tamamlandı: ${filename}.stl`);
            window.showToast?.(`STL dosyası indirildi: ${filename}.stl`, 'ok');

        } catch (error) {
            console.error('❌ STL Export hatası:', error);
            window.showToast?.('STL export sırasında hata oluştu: ' + error.message, 'error');
        }
    }

    /**
     * 📤 DXF Export (3D mesh format with 3DFACE)
     * @param {number|null} layerNum - Katman numarası (null ise tüm katmanlar)
     */
    exportDXF(layerNum = null) {
        try {
            console.log(`📤 DXF Export başlatıldı (Layer: ${layerNum !== null ? layerNum : 'TÜM KATMANLAR'})`);

            let dxfContent = this.createDXFHeader();
            let filename = 'puskul';
            let faceCount = 0;

            let meshes = []; // Mesh'leri topla (STL gibi)

            if (layerNum !== null) {
                // Tek katman export
                const layer = this.viewer.layers[layerNum];
                if (!layer || !layer.mesh) {
                    window.showToast?.('Bu katman için mesh bulunamadı!', 'error');
                    return;
                }

                meshes.push({ mesh: layer.mesh, layerName: `Layer_${layerNum}` });

                // Köprü yüzeyleri
                if (layer.bridgeMesh && Array.isArray(layer.bridgeMesh)) {
                    layer.bridgeMesh.forEach((bridge, i) => {
                        if (bridge && bridge.geometry) {
                            meshes.push({ mesh: bridge, layerName: `Layer_${layerNum}_Bridge_${i}` });
                        }
                    });
                }

                // Geçiş yüzeyi
                if (layer.extrudeMesh && layer.extrudeMesh.geometry) {
                    meshes.push({ mesh: layer.extrudeMesh, layerName: `Layer_${layerNum}_Transition` });
                }

                filename = `puskul-layer-${layerNum}`;

            } else {
                // Tüm katmanlar export
                for (let lNum in this.viewer.layers) {
                    const layer = this.viewer.layers[lNum];
                    if (layer && layer.mesh) {
                        meshes.push({ mesh: layer.mesh, layerName: `Layer_${lNum}` });

                        // Köprü yüzeyleri
                        if (layer.bridgeMesh && Array.isArray(layer.bridgeMesh)) {
                            layer.bridgeMesh.forEach((bridge, i) => {
                                if (bridge && bridge.geometry) {
                                    meshes.push({ mesh: bridge, layerName: `Layer_${lNum}_Bridge_${i}` });
                                }
                            });
                        }

                        // Geçiş yüzeyi
                        if (layer.extrudeMesh && layer.extrudeMesh.geometry) {
                            meshes.push({ mesh: layer.extrudeMesh, layerName: `Layer_${lNum}_Transition` });
                        }
                    }
                }

                filename = 'puskul-all-layers';
            }

            if (meshes.length === 0) {
                window.showToast?.('Export edilecek mesh bulunamadı!', 'error');
                return;
            }

            console.log(`📊 ${meshes.length} mesh export edilecek`);

            // Tüm mesh'leri birleştir
            const allMeshes = meshes.map(m => m.mesh);
            console.log('🔧 Meshler birleştiriliyor...');
            const mergedGeometry = this.mergeMeshes(allMeshes);

            // Vertex welding yap
            console.log('🔧 Vertex welding başlatılıyor...');
            const weldedGeometry = this.weldVertices(mergedGeometry);

            // Welded geometry'den 3DFACE'ler oluştur
            console.log('🔧 3DFACE entityleri oluşturuluyor...');
            const faces = this.geometryTo3DFaces(weldedGeometry, 'Puskul_Model');
            dxfContent += faces;
            faceCount = faces.split('3DFACE').length - 1;

            dxfContent += this.createDXFFooter();

            console.log(`📊 DXF: ${faceCount} face, ${dxfContent.length} bytes`);

            // Dosyayı indir
            this.downloadFile(dxfContent, `${filename}.dxf`, 'application/dxf');

            console.log(`✅ DXF export tamamlandı: ${filename}.dxf`);
            window.showToast?.(`DXF dosyası indirildi: ${filename}.dxf (${faceCount} faces)`, 'ok');

        } catch (error) {
            console.error('❌ DXF Export hatası:', error);
            window.showToast?.('DXF export sırasında hata oluştu: ' + error.message, 'error');
        }
    }

    /**
     * 🔧 Mesh'leri transform'larıyla birlikte birleştir
     */
    mergeMeshes(meshes) {
        if (meshes.length === 0) return null;

        const merged = new THREE.BufferGeometry();
        let positions = [];

        meshes.forEach((mesh, meshIndex) => {
            if (!mesh || !mesh.geometry) return;

            const geom = mesh.geometry;
            const posAttr = geom.attributes.position;
            const index = geom.index;

            // Mesh'in world matrix'ini al
            mesh.updateMatrixWorld(true);
            const matrix = mesh.matrixWorld;

            console.log(`📦 Mesh ${meshIndex}: ${mesh.name || 'unnamed'}, vertices: ${posAttr.count}, indexed: ${!!index}`);

            if (index) {
                // Indexed geometry - index array'i kullan
                const indexArray = index.array;
                const vertex = new THREE.Vector3();

                for (let i = 0; i < indexArray.length; i++) {
                    const idx = indexArray[i];
                    vertex.set(
                        posAttr.getX(idx),
                        posAttr.getY(idx),
                        posAttr.getZ(idx)
                    );
                    vertex.applyMatrix4(matrix);
                    positions.push(vertex.x, vertex.y, vertex.z);
                }

                console.log(`  → Indexed: ${indexArray.length / 3} triangles`);
            } else {
                // Non-indexed geometry - direkt position array kullan
                const vertex = new THREE.Vector3();
                for (let i = 0; i < posAttr.count; i++) {
                    vertex.set(
                        posAttr.getX(i),
                        posAttr.getY(i),
                        posAttr.getZ(i)
                    );
                    vertex.applyMatrix4(matrix);
                    positions.push(vertex.x, vertex.y, vertex.z);
                }

                console.log(`  → Non-indexed: ${posAttr.count / 3} triangles`);
            }
        });

        merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        merged.computeVertexNormals();

        console.log(`✅ Toplam ${meshes.length} mesh birleştirildi, ${positions.length / 3} vertex`);

        return merged;
    }

    /**
     * 🔧 Vertex welding - Ortak koordinatlardaki vertex'leri birleştir
     */
    weldVertices(geometry, tolerance = 0.0001) {
        const positions = geometry.attributes.position.array;
        const vertexCount = positions.length / 3;

        // Hash map: koordinat string -> yeni index
        const vertexMap = new Map();
        const uniqueVertices = [];
        const indexMap = []; // Eski index -> Yeni index

        // Tolerance için precision hesapla
        const precision = Math.max(0, -Math.floor(Math.log10(tolerance)));

        for (let i = 0; i < vertexCount; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];

            // Koordinatı hash key'e çevir
            const key = `${x.toFixed(precision)},${y.toFixed(precision)},${z.toFixed(precision)}`;

            if (vertexMap.has(key)) {
                // Bu vertex zaten var, mevcut index'i kullan
                indexMap[i] = vertexMap.get(key);
            } else {
                // Yeni unique vertex
                const newIndex = uniqueVertices.length / 3;
                uniqueVertices.push(x, y, z);
                vertexMap.set(key, newIndex);
                indexMap[i] = newIndex;
            }
        }

        // Yeni indexed geometry oluştur
        const weldedGeometry = new THREE.BufferGeometry();
        weldedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(uniqueVertices, 3));

        // Index array oluştur (üçer üçer triangle'lar)
        const indices = [];
        for (let i = 0; i < vertexCount; i++) {
            indices.push(indexMap[i]);
        }
        weldedGeometry.setIndex(indices);

        // Normal'leri yeniden hesapla
        weldedGeometry.computeVertexNormals();

        const originalTriangles = vertexCount / 3;
        const uniqueVertexCount = uniqueVertices.length / 3;
        const reduction = ((vertexCount - uniqueVertexCount) / vertexCount * 100).toFixed(1);

        console.log(`✅ Vertex welding tamamlandı:`);
        console.log(`   Önce: ${vertexCount} vertex (${originalTriangles} triangle)`);
        console.log(`   Sonra: ${uniqueVertexCount} unique vertex`);
        console.log(`   Azalma: %${reduction}`);

        return weldedGeometry;
    }

    /**
     * 🔧 Geometry'yi STL binary formatına çevir (indexed veya non-indexed)
     */
    geometryToSTLBinary(geometry) {
        const posAttr = geometry.attributes.position;
        const index = geometry.index;

        let triangles;
        if (index) {
            triangles = index.count / 3;
        } else {
            triangles = posAttr.count / 3;
        }

        console.log(`📊 STL Binary: ${triangles} triangle, indexed: ${!!index}`);

        const bufferSize = 80 + 4 + triangles * 50; // Header(80) + count(4) + triangles * 50
        const buffer = new ArrayBuffer(bufferSize);
        const view = new DataView(buffer);

        // Header (80 bytes)
        const header = 'Püskül 3D Viewer STL Export';
        for (let i = 0; i < 80; i++) {
            view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
        }

        // Triangle count (4 bytes)
        view.setUint32(80, triangles, true);

        let offset = 84;

        for (let i = 0; i < triangles; i++) {
            let v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z;

            if (index) {
                // Indexed geometry
                const idx1 = index.getX(i * 3);
                const idx2 = index.getX(i * 3 + 1);
                const idx3 = index.getX(i * 3 + 2);

                v1x = posAttr.getX(idx1);
                v1y = posAttr.getY(idx1);
                v1z = posAttr.getZ(idx1);

                v2x = posAttr.getX(idx2);
                v2y = posAttr.getY(idx2);
                v2z = posAttr.getZ(idx2);

                v3x = posAttr.getX(idx3);
                v3y = posAttr.getY(idx3);
                v3z = posAttr.getZ(idx3);
            } else {
                // Non-indexed geometry
                const i3 = i * 3;

                v1x = posAttr.getX(i3);
                v1y = posAttr.getY(i3);
                v1z = posAttr.getZ(i3);

                v2x = posAttr.getX(i3 + 1);
                v2y = posAttr.getY(i3 + 1);
                v2z = posAttr.getZ(i3 + 1);

                v3x = posAttr.getX(i3 + 2);
                v3y = posAttr.getY(i3 + 2);
                v3z = posAttr.getZ(i3 + 2);
            }

            // Normal hesapla (cross product)
            const edge1x = v2x - v1x;
            const edge1y = v2y - v1y;
            const edge1z = v2z - v1z;

            const edge2x = v3x - v1x;
            const edge2y = v3y - v1y;
            const edge2z = v3z - v1z;

            const nx = edge1y * edge2z - edge1z * edge2y;
            const ny = edge1z * edge2x - edge1x * edge2z;
            const nz = edge1x * edge2y - edge1y * edge2x;

            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            const normX = len > 0 ? nx / len : 0;
            const normY = len > 0 ? ny / len : 0;
            const normZ = len > 0 ? nz / len : 0;

            // Normal vector (12 bytes)
            view.setFloat32(offset, normX, true);
            view.setFloat32(offset + 4, normY, true);
            view.setFloat32(offset + 8, normZ, true);
            offset += 12;

            // Vertex 1 (12 bytes)
            view.setFloat32(offset, v1x, true);
            view.setFloat32(offset + 4, v1y, true);
            view.setFloat32(offset + 8, v1z, true);
            offset += 12;

            // Vertex 2 (12 bytes)
            view.setFloat32(offset, v2x, true);
            view.setFloat32(offset + 4, v2y, true);
            view.setFloat32(offset + 8, v2z, true);
            offset += 12;

            // Vertex 3 (12 bytes)
            view.setFloat32(offset, v3x, true);
            view.setFloat32(offset + 4, v3y, true);
            view.setFloat32(offset + 8, v3z, true);
            offset += 12;

            // Attribute byte count (2 bytes) - always 0
            view.setUint16(offset, 0, true);
            offset += 2;
        }

        console.log(`✅ STL Binary oluşturuldu: ${bufferSize} bytes, ${triangles} triangles`);
        return buffer;
    }

    /**
     * 🔧 Geometry'den outline çıkar (Outer boundary noktaları)
     */
    extractOutline(geometry, zOffset = 0) {
        const outline = [];

        // PuskulGeometry ise customOuterBoundary veya outerRadius kullan
        if (geometry.customOuterBoundary) {
            // Custom boundary varsa onu kullan
            geometry.customOuterBoundary.forEach(pt => {
                outline.push({
                    x: pt.x,
                    y: pt.y,
                    z: (pt.z || 0) + zOffset
                });
            });
            console.log(`📐 Outline çıkarıldı (custom boundary): ${outline.length} nokta`);
        } else if (geometry.outerRadius && geometry.sides) {
            // Outer radius ile ngon noktalarını hesapla
            const radius = geometry.outerRadius;
            const sides = geometry.sides;
            const angleOffset = geometry.placement === 'corner' ? 0 : (Math.PI / sides);

            for (let i = 0; i < sides; i++) {
                const angle = (i * 2 * Math.PI / sides) + angleOffset;
                outline.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle),
                    z: zOffset
                });
            }
            console.log(`📐 Outline çıkarıldı (outerRadius): ${outline.length} nokta, radius: ${radius}`);
        } else {
            console.warn('⚠️ Geometry outline bilgisi bulunamadı');
        }

        return outline;
    }

    /**
     * 🔧 Mesh'ten outline çıkar (boundary detection)
     */
    extractOutlineFromMesh(mesh) {
        const outline = [];

        // Mesh'in world matrix'ini al
        mesh.updateMatrixWorld(true);
        const matrix = mesh.matrixWorld;

        const geom = mesh.geometry;
        const posAttr = geom.attributes.position;
        const index = geom.index;

        // Tüm vertex'leri world koordinatlarına çevir
        const vertices = [];
        const vertex = new THREE.Vector3();

        if (index) {
            // Indexed geometry - unique vertex'leri al
            for (let i = 0; i < posAttr.count; i++) {
                vertex.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
                vertex.applyMatrix4(matrix);
                vertices.push({ x: vertex.x, y: vertex.y, z: vertex.z });
            }
        } else {
            // Non-indexed geometry
            for (let i = 0; i < posAttr.count; i++) {
                vertex.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
                vertex.applyMatrix4(matrix);
                vertices.push({ x: vertex.x, y: vertex.y, z: vertex.z });
            }
        }

        if (vertices.length === 0) return outline;

        // En üst Z seviyesini bul
        const maxZ = Math.max(...vertices.map(v => v.z));
        const tolerance = 0.1; // Z toleransı

        // En üst seviyedeki vertex'leri filtrele
        const topVertices = vertices.filter(v => Math.abs(v.z - maxZ) < tolerance);

        // Açıya göre sırala (origin'den)
        topVertices.sort((a, b) => {
            const angleA = Math.atan2(a.y, a.x);
            const angleB = Math.atan2(b.y, b.x);
            return angleA - angleB;
        });

        // Yakın vertex'leri birleştir (simplify)
        const simplifyTolerance = 1.0; // 1 birim yakınlık
        if (topVertices.length > 0) {
            outline.push(topVertices[0]);

            for (let i = 1; i < topVertices.length; i++) {
                const last = outline[outline.length - 1];
                const curr = topVertices[i];
                const dist = Math.sqrt(
                    Math.pow(curr.x - last.x, 2) +
                    Math.pow(curr.y - last.y, 2)
                );

                if (dist > simplifyTolerance) {
                    outline.push(curr);
                }
            }
        }

        console.log(`📐 Outline çıkarıldı (mesh'ten): ${outline.length} nokta (${topVertices.length} üst vertex'ten)`);

        return outline;
    }

    /**
     * 🔧 DXF header oluştur (minimal)
     */
    createDXFHeader() {
        return `0
SECTION
2
ENTITIES
`;
    }

    /**
     * 🔧 DXF footer oluştur
     */
    createDXFFooter() {
        return `0
ENDSEC
0
EOF
`;
    }

    /**
     * 🔧 Geometry'yi 3DFACE entity'lerine çevir (indexed geometry için)
     */
    geometryTo3DFaces(geometry, layerName) {
        let dxf = '';

        const posAttr = geometry.attributes.position;
        const index = geometry.index;

        if (!index) {
            console.warn('⚠️ Non-indexed geometry, converting...');
            // Non-indexed ise eski fonksiyonu kullan
            return this.meshTo3DFaces({ geometry: geometry, updateMatrixWorld: () => {}, matrixWorld: new THREE.Matrix4() }, layerName);
        }

        const triangleCount = index.count / 3;

        for (let i = 0; i < triangleCount; i++) {
            const idx1 = index.getX(i * 3);
            const idx2 = index.getX(i * 3 + 1);
            const idx3 = index.getX(i * 3 + 2);

            const v1 = {
                x: posAttr.getX(idx1),
                y: posAttr.getY(idx1),
                z: posAttr.getZ(idx1)
            };

            const v2 = {
                x: posAttr.getX(idx2),
                y: posAttr.getY(idx2),
                z: posAttr.getZ(idx2)
            };

            const v3 = {
                x: posAttr.getX(idx3),
                y: posAttr.getY(idx3),
                z: posAttr.getZ(idx3)
            };

            // 3DFACE entity (üçgen için 4. nokta = 3. nokta)
            dxf += `0
3DFACE
8
${layerName}
10
${v1.x.toFixed(6)}
20
${v1.y.toFixed(6)}
30
${v1.z.toFixed(6)}
11
${v2.x.toFixed(6)}
21
${v2.y.toFixed(6)}
31
${v2.z.toFixed(6)}
12
${v3.x.toFixed(6)}
22
${v3.y.toFixed(6)}
32
${v3.z.toFixed(6)}
13
${v3.x.toFixed(6)}
23
${v3.y.toFixed(6)}
33
${v3.z.toFixed(6)}
`;
        }

        return dxf;
    }

    /**
     * 🔧 Mesh'i 3DFACE entity'lerine çevir
     */
    meshTo3DFaces(mesh, layerName) {
        let dxf = '';

        // Mesh'in world matrix'ini al
        mesh.updateMatrixWorld(true);
        const matrix = mesh.matrixWorld;

        const geom = mesh.geometry;
        const posAttr = geom.attributes.position;
        const index = geom.index;

        const vertex = new THREE.Vector3();

        if (index) {
            // Indexed geometry
            const triangleCount = index.count / 3;

            for (let i = 0; i < triangleCount; i++) {
                const idx1 = index.getX(i * 3);
                const idx2 = index.getX(i * 3 + 1);
                const idx3 = index.getX(i * 3 + 2);

                // Vertex 1
                vertex.set(posAttr.getX(idx1), posAttr.getY(idx1), posAttr.getZ(idx1));
                vertex.applyMatrix4(matrix);
                const v1 = { x: vertex.x, y: vertex.y, z: vertex.z };

                // Vertex 2
                vertex.set(posAttr.getX(idx2), posAttr.getY(idx2), posAttr.getZ(idx2));
                vertex.applyMatrix4(matrix);
                const v2 = { x: vertex.x, y: vertex.y, z: vertex.z };

                // Vertex 3
                vertex.set(posAttr.getX(idx3), posAttr.getY(idx3), posAttr.getZ(idx3));
                vertex.applyMatrix4(matrix);
                const v3 = { x: vertex.x, y: vertex.y, z: vertex.z };

                // 3DFACE entity (üçgen için 4. nokta = 3. nokta)
                dxf += `0
3DFACE
8
${layerName}
10
${v1.x.toFixed(6)}
20
${v1.y.toFixed(6)}
30
${v1.z.toFixed(6)}
11
${v2.x.toFixed(6)}
21
${v2.y.toFixed(6)}
31
${v2.z.toFixed(6)}
12
${v3.x.toFixed(6)}
22
${v3.y.toFixed(6)}
32
${v3.z.toFixed(6)}
13
${v3.x.toFixed(6)}
23
${v3.y.toFixed(6)}
33
${v3.z.toFixed(6)}
`;
            }
        } else {
            // Non-indexed geometry
            const triangleCount = posAttr.count / 3;

            for (let i = 0; i < triangleCount; i++) {
                const i3 = i * 3;

                // Vertex 1
                vertex.set(posAttr.getX(i3), posAttr.getY(i3), posAttr.getZ(i3));
                vertex.applyMatrix4(matrix);
                const v1 = { x: vertex.x, y: vertex.y, z: vertex.z };

                // Vertex 2
                vertex.set(posAttr.getX(i3 + 1), posAttr.getY(i3 + 1), posAttr.getZ(i3 + 1));
                vertex.applyMatrix4(matrix);
                const v2 = { x: vertex.x, y: vertex.y, z: vertex.z };

                // Vertex 3
                vertex.set(posAttr.getX(i3 + 2), posAttr.getY(i3 + 2), posAttr.getZ(i3 + 2));
                vertex.applyMatrix4(matrix);
                const v3 = { x: vertex.x, y: vertex.y, z: vertex.z };

                // 3DFACE entity
                dxf += `0
3DFACE
8
${layerName}
10
${v1.x.toFixed(6)}
20
${v1.y.toFixed(6)}
30
${v1.z.toFixed(6)}
11
${v2.x.toFixed(6)}
21
${v2.y.toFixed(6)}
31
${v2.z.toFixed(6)}
12
${v3.x.toFixed(6)}
22
${v3.y.toFixed(6)}
32
${v3.z.toFixed(6)}
13
${v3.x.toFixed(6)}
23
${v3.y.toFixed(6)}
33
${v3.z.toFixed(6)}
`;
            }
        }

        return dxf;
    }

    /**
     * 🔧 Outline'ı DXF LINE entity'lerine çevir (3dsmax uyumlu)
     */
    outlineToDXF(outline, layerName) {
        if (outline.length === 0) return '';

        let dxf = '';

        // Her segment için bir LINE entity
        for (let i = 0; i < outline.length; i++) {
            const pt1 = outline[i];
            const pt2 = outline[(i + 1) % outline.length]; // Kapalı loop

            dxf += `0
LINE
8
${layerName}
10
${pt1.x.toFixed(6)}
20
${pt1.y.toFixed(6)}
30
${pt1.z.toFixed(6)}
11
${pt2.x.toFixed(6)}
21
${pt2.y.toFixed(6)}
31
${pt2.z.toFixed(6)}
`;
        }

        return dxf;
    }

    /**
     * 🔧 Dosya indir
     */
    downloadFile(content, filename, mimeType) {
        let blob;
        if (content instanceof ArrayBuffer) {
            blob = new Blob([content], { type: mimeType });
        } else {
            blob = new Blob([content], { type: mimeType });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
} else {
    window.ExportManager = ExportManager;
}
