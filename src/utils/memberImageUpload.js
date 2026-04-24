const MEMBER_IMAGE_BUCKET = "member-images";

const MIME_TYPE_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
};

function getFileExtension(file) {
    const originalName = String(file?.name ?? "");
    const dotIndex = originalName.lastIndexOf(".");
    if (dotIndex >= 0 && dotIndex < originalName.length - 1) {
        return originalName.slice(dotIndex + 1).toLowerCase();
    }

    const mimeType = String(file?.type ?? "").toLowerCase();
    return MIME_TYPE_EXTENSIONS[mimeType] ?? "bin";
}

export async function uploadMemberImage({ supabase, file, fieldName }) {
    if (!file) return null;

    const extension = getFileExtension(file);
    const objectPath = `members/${fieldName}/${crypto.randomUUID()}.${extension}`;
    const storage = supabase.storage.from(MEMBER_IMAGE_BUCKET);

    const { error: uploadError } = await storage.upload(objectPath, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: true,
    });

    if (uploadError) {
        throw new Error(uploadError.message || "画像アップロードに失敗しました。");
    }

    const { data } = storage.getPublicUrl(objectPath);
    if (!data?.publicUrl) {
        throw new Error("画像の公開URL取得に失敗しました。");
    }

    return {
        objectPath,
        publicUrl: data.publicUrl,
    };
}

export { MEMBER_IMAGE_BUCKET };
