import PdfReader from '@/components/PdfReader';

export const metadata = { title: 'Leaflet • HOLY NIGHT, CITY LIGHTS' };

export default function LeafletPage() {
  return (
    <div>
      <p className="eyebrow">The Night Edition</p>
      <h1 className="text-3xl">Event leaflet</h1>
      <div className="rule-gold mb-4 mt-3" />
      <PdfReader src="/leaflet.pdf" />
    </div>
  );
}
