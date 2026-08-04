/**
 * View Utilities
 * Kamera ve görünüm ile ilgili yardımcı fonksiyonlar
 */

class ViewUtils {
    
    /**
     * Sahne objelerini tam ekranda göster (zoom extent)
     * @param {Object} viewer - PuskulViewer instance
     */
    static zoomExtent(viewer) {
        if (!viewer.puskulMesh) return;

        // Bounding box hesapla
        const box = new THREE.Box3().setFromObject(viewer.puskulMesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // En büyük boyutu al
        const maxDim = Math.max(size.x, size.y, size.z);

        // Kamera mesafesini hesapla (FOV'a göre)
        const fov = viewer.camera.fov * (Math.PI / 180);
        const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.75; // %25 margin azaltıldı

        // Kamera pozisyonunu güncelle (mevcut açıyı koru)
        const direction = new THREE.Vector3();
        viewer.camera.getWorldDirection(direction);
        direction.negate(); // Kameradan mesh'e doğru
        direction.normalize();

        viewer.camera.position.copy(center).add(direction.multiplyScalar(cameraDistance));
        viewer.controls.target.copy(center);
        viewer.controls.update();

        console.log(`🔍 Zoom Extent: center=(${center.x.toFixed(1)}, ${center.y.toFixed(1)}, ${center.z.toFixed(1)}), distance=${cameraDistance.toFixed(1)}, maxDim=${maxDim.toFixed(1)}`);
    }
}


