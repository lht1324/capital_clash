import {NextRequest, NextResponse} from "next/server";
import {imagesServerAPI} from "@/api/server/supabase/imagesServerAPI";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const file = formData.get('file') as (File | null);
        const userId = formData.get('userId') as (string | null);
        const playerId = formData.get('playerId') as (string | null);

        if (!file || !userId || !playerId) throw Error("Invalid form data");

        const data = await imagesServerAPI.uploadImage(file, userId, playerId);

        return NextResponse.json(data ? { ...data } : null, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const {
            userImageUrl,
        } = await req.json();

        const existingImage = await imagesServerAPI.selectImagesByImageUrl(userImageUrl);
        if (!existingImage) throw Error("Image was already deleted.");

        const filePath = await imagesServerAPI.getFilePathFromUrl(existingImage.original_url);
        if (!filePath) throw Error("Image was already deleted.");

        const isDeleteSuccess = await imagesServerAPI.deleteImage(existingImage.id, filePath);

        return NextResponse.json({ isDeleteSuccess }, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}