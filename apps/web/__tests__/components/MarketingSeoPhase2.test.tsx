import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LandingPage from "@/app/(marketing)/page";
import CompanyDocPage, {
  generateMetadata as generateCompanyMetadata,
} from "@/app/(marketing)/empresa/[slug]/page";
import LegalDocPage, {
  generateMetadata as generateLegalMetadata,
} from "@/app/(marketing)/legal/[slug]/page";

describe("Marketing SEO phase 2", () => {
  it("renders landing CTAs with tracking attributes", () => {
    const { container } = render(<LandingPage />);
    expect(
      screen.getByRole("link", { name: /necesito un flete/i }).getAttribute("data-marketing-event")
    ).toBe("hero_cta_client");
    const trackedDriverCta = container.querySelector('[data-marketing-event="hero_cta_driver"]');
    expect(trackedDriverCta?.getAttribute("href")).toBe("/login?role=driver");
  });

  it("renders company institutional page with conversion links", () => {
    render(<CompanyDocPage params={{ slug: "sobre-fletaya" }} />);
    expect(screen.getByRole("heading", { name: /^sobre fleteya$/i, level: 1 })).toBeTruthy();
    expect(screen.getByRole("link", { name: /publicar envío/i }).getAttribute("href")).toBe(
      "/login?role=client"
    );
  });

  it("renders legal page with related document links", () => {
    render(<LegalDocPage params={{ slug: "terminos-y-condiciones" }} />);
    expect(screen.getByRole("heading", { name: /términos y condiciones/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /documentos relacionados/i })).toBeTruthy();
  });

  it("builds slug metadata for institutional pages", () => {
    const companyMetadata = generateCompanyMetadata({ params: { slug: "contacto" } });
    expect(companyMetadata.title).toContain("Contacto");
    const legalMetadata = generateLegalMetadata({ params: { slug: "politica-de-privacidad" } });
    expect(legalMetadata.title).toContain("Política de privacidad");
  });
});
