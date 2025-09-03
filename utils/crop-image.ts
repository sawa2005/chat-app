export const getCroppedImg = (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.crossOrigin = "anonymous";

        image.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) return reject(new Error("Canvas context not found."));

            canvas.width = 100;
            canvas.height = 100;

            ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 100, 100);

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error("Failed to create blob"));
                    resolve(blob);
                },
                "image/jpeg",
                0.9
            );
        };

        image.onerror = (error) => reject(error);
    });
};
