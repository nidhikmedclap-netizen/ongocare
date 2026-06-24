import { buildLegalPage } from "@/lib/legal/render";

const { metadata, Page } = buildLegalPage("privacy-practices");
export { metadata };
export default Page;
