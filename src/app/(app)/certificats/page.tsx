import { CertificatsClient } from "@/components/certificats/certificats-client";
import { DocumentsHub } from "@/components/documents/documents-hub";
import "@/styles/documents.css";

export default function CertificatsPage() {
  return (
    <div className="space-y-8">
      <DocumentsHub />
      <CertificatsClient />
    </div>
  );
}
