"use client";

import React, { useRef, useState } from "react";
import { setPath, type SupportStoragePath } from "@/lib/api/storage";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/lib/firebase/web-api";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MAX_IMAGE_SIZE } from "@/lib/vars";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { formatFileSize } from "@/lib/web-utils";

type Props = {
  path: SupportStoragePath;
  onUploadComplete: (url: string | null) => void;
};

// TODO: file url, image url 따로 두는게 좋을듯, 그리고 modal 로 저장소 보여주는게 좋을듯
export default function ImageUploader({ path, onUploadComplete }: Props) {
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [useFile, setUseFile] = useState(false);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(`3 MB 이상의 이미지는 업로드할 수 없습니다.\n현재용량: ${formatFileSize(file)}`);
      resetFileInput();
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: MAX_IMAGE_SIZE,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const storagePath = setPath(path, user.uid, compressed);
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, compressed);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(pct));
        },
        (err) => {
          console.error("Upload error", err);
          toast.error("업로드 중 오류가 발생했습니다.");
          setUploading(false);
          resetFileInput();
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setImageUrl(url);
          onUploadComplete(url);
          setUploading(false);
          toast.success("이미지 업로드 완료!");
        }
      );
    } catch (err) {
      console.error("Compression error", err);
      toast.error("이미지 압축 중 오류가 발생했습니다.");
      setUploading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    onUploadComplete(url);
  };

  const handleClear = () => {
    setImageUrl("");
    onUploadComplete(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Switch checked={useFile} onCheckedChange={setUseFile} />
        <Label>{useFile ? "파일 업로드" : "URL 입력"}</Label>
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt="Uploaded preview"
          className="w-full max-w-xs rounded border"
        />
      )}

      {useFile ? (
        <>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading && <Progress value={progress} />}
        </>
      ) : (
        <Input
          placeholder="이미지 URL을 입력하거나 파일을 업로드하세요"
          value={imageUrl ?? ""}
          onChange={handleUrlChange}
          disabled={uploading}
        />
      )}

      {!uploading && imageUrl && (
        <Button type="button" variant="secondary" onClick={handleClear}>
          이미지 제거
        </Button>
      )}
    </div>
  );
}
