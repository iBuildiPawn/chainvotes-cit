This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Bulk Data Import

### Candidate Import

The system supports bulk candidate registration through CSV files. You can use the provided templates:

- `national_election_candidates.csv` - Template for national elections
- `stress_test_candidates.csv` - Large dataset for performance testing

#### CSV Format

```csv
name,position,bio,imageUrl
John Doe,President,"Candidate bio here...",https://example.com/image.jpg
```

Required fields:
- `name`: Candidate's full name
- `position`: Must match existing position name (case-insensitive)
- `bio`: Brief candidate biography
- `imageUrl`: Optional profile image URL (HTTPS required)

#### Best Practices

1. **Position Names**: Ensure position names in CSV exactly match created positions
2. **Bio Length**: Keep bios between 50-500 characters
3. **Images**: Use secure HTTPS URLs for images
4. **Batch Size**: For optimal performance, import up to 20 candidates per batch
5. **Validation**: Preview data after import before final submission

### Error Handling

The system provides detailed error messages for common issues:
- Missing required columns
- Invalid position names
- Missing required fields
- Invalid image URLs

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
