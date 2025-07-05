CREATE POLICY "delete own image in player-images"
  ON storage.objects
  FOR DELETE               -- 삭제 권한만 부여
TO authenticated
  USING (
    bucket_id = 'player-images'
    AND auth.uid()::text = (regexp_split_to_array(name, '_'))[1]
        -- ⬆️  파일명이  "USERID_..." 형식일 때 첫 토큰과 uid() 비교
  );