import dynamic from "next/dynamic";

const ISFDashboard = dynamic(() => import("./ISFDashboard"), { ssr: false });

export default function Page() {
  return <ISFDashboard />;
}
