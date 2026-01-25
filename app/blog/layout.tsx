import { DataStreamProvider } from '@/components/data-stream-provider';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataStreamProvider>{children}</DataStreamProvider>
  );
}
