# Workout screenshots

The workout logger supports one optional screenshot per submitted workout. If several exercises are selected, the screenshot is uploaded once and its URL is attached to every resulting activity row.

## Image handling

- Only JPEG, PNG, and WebP are accepted.
- The browser resizes the long edge to at most 1600px, re-encodes as JPEG, and steps down from 82% to 52% quality until the result is at most 4 MB.
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
