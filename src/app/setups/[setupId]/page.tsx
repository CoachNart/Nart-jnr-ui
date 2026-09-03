import SetupAnalysisPage from "../../../components/setup-analysis-page";

export default async function Page({ params }: { params: Promise<{ setupId: string }> }) {
  const { setupId } = await params;
  return <SetupAnalysisPage setupId={setupId} />;
}
