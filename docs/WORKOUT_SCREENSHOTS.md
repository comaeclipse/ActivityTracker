# Workout screenshots

The workout logger supports one optional screenshot per submitted workout. If several exercises are selected, the screenshot is uploaded once and its URL is attached to every resulting activity row.

## Image handling

- Only JPEG, PNG, and WebP are accepted.
- Images at or below 2400px on their long edge and 4 MB are uploaded unchanged, preserving screenshot text and app UI details.
- Larger images are resized to a 2400px maximum long edge and encoded as WebP, stepping from 94% to 75% quality until the result is at most 4 MB.
- The server revalidates the MIME type and 4 MB cap before storing the file in Vercel Blob.
- Images are intentionally stored with public access because they are shown in the community and profile activity feeds. Do not include sensitive workout-app data in a screenshot.

Vercel Blob stores the bytes it receives; it does not automatically resize or compress images. Browser-side compression keeps the upload and Blob storage/egress footprint low without adding an image-processing runtime dependency.

## Deployment setup

1. In the Vercel project, create or connect a Vercel Blob store. This supplies the `BLOB_READ_WRITE_TOKEN` environment variable.
2. Make the same variable available to the deployment environment. Do not expose it to the browser.
3. Apply the Prisma schema update before releasing:

   ```powershell
   npx prisma db push
   ```

   This adds `Activity.photoUrl` and the `STAIRMASTER` value to `ActivityType`.

Local uploads require a Blob token as well; without one the normal workout log still works, while an attempted screenshot upload returns an error from the upload endpoint.

When an activity is deleted, its Blob is deleted too once no other activity row references that URL. This keeps a multi-exercise submission safe: its shared screenshot remains until the final activity in that submission is deleted.
