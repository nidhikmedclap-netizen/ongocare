import { buildLegalPage } from "@/lib/legal/render";

const { metadata, Page } = buildLegalPage("medical-disclaimer");
export { metadata };
export default Page;
