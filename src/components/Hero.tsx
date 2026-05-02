import bgImage from '../background.jpg';

export default function Hero() {
  return (
    <div className="relative w-full h-64">
      <img
        src={bgImage}
        alt="Slo Sunset"
        className="w-full h-full object-cover brightness-75"
      />
    </div>
  );
}
