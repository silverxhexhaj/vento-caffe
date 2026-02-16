"use client";

import { useTranslations } from "next-intl";

export default function MachineSpecsSection() {
  const t = useTranslations("products.espressoMachine");
  const ecoBenefits = t.raw("ecoBenefits") as string[] | undefined;
  const optionalEquipment = t.raw("optionalEquipment") as string[] | undefined;

  return (
    <div className="mt-12 space-y-12 border-t border-[var(--border)] pt-12">
      {/* Brand block */}
      <section>
        <h3 className="text-sm uppercase tracking-widest text-muted mb-4">
          {t("sections.aboutBrand")}
        </h3>
        <p className="text-muted leading-relaxed">{t("brandDescription")}</p>
      </section>

      {/* Key features */}
      <section>
        <h3 className="text-sm uppercase tracking-widest text-muted mb-6">
          {t("sections.keyFeatures")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-[var(--border)] p-6">
            <h4 className="font-medium mb-4">{t("features.coffeeSystem.title")}</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <span className="text-[var(--foreground)]">{t("features.coffeeSystem.dispensingLabel")}:</span>{" "}
                {t("features.coffeeSystem.dispensing")}
              </li>
              <li>
                <span className="text-[var(--foreground)]">{t("features.coffeeSystem.compatibleLabel")}:</span>{" "}
                {t("features.coffeeSystem.compatible")}
              </li>
              <li>
                <span className="text-[var(--foreground)]">{t("features.coffeeSystem.pumpPressureLabel")}:</span>{" "}
                {t("features.coffeeSystem.pumpPressure")}
              </li>
            </ul>
          </div>
          <div className="border border-[var(--border)] p-6">
            <h4 className="font-medium mb-4">{t("features.buildDesign.title")}</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <span className="text-[var(--foreground)]">{t("features.buildDesign.bodyLabel")}:</span>{" "}
                {t("features.buildDesign.body")}
              </li>
              <li>
                <span className="text-[var(--foreground)]">{t("features.buildDesign.controlPanelLabel")}:</span>{" "}
                {t("features.buildDesign.controlPanel")}
              </li>
              <li>
                <span className="text-[var(--foreground)]">{t("features.buildDesign.cableLengthLabel")}:</span>{" "}
                {t("features.buildDesign.cableLength")}
              </li>
            </ul>
          </div>
          <div className="border border-[var(--border)] p-6">
            <h4 className="font-medium mb-4">{t("features.waterTank.title")}</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <span className="text-[var(--foreground)]">{t("features.waterTank.capacityLabel")}:</span>{" "}
                {t("features.waterTank.capacity")}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Dimensions & Energy specs tables */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm uppercase tracking-widest text-muted mb-4">
            {t("sections.dimensionsWeight")}
          </h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-[var(--border)]">
                <td className="py-3 text-muted">{t("dimensions.widthLabel")}</td>
                <td className="py-3 text-right">{t("dimensions.width")}</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-3 text-muted">{t("dimensions.depthLabel")}</td>
                <td className="py-3 text-right">{t("dimensions.depth")}</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-3 text-muted">{t("dimensions.heightLabel")}</td>
                <td className="py-3 text-right">{t("dimensions.height")}</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-3 text-muted">{t("dimensions.weightLabel")}</td>
                <td className="py-3 text-right">{t("dimensions.weight")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-widest text-muted mb-4">
            {t("sections.energySpecs")}
          </h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-[var(--border)]">
                <td className="py-3 text-muted">{t("energySpecsLabels.power")}</td>
                <td className="py-3 text-right">{t("energySpecs.power")}</td>
              </tr>
              <tr className="border-b border-[var(--border)]">
                <td className="py-3 text-muted">{t("energySpecsLabels.voltage")}</td>
                <td className="py-3 text-right">{t("energySpecs.voltage")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Eco & Sustainability */}
      {ecoBenefits && ecoBenefits.length > 0 && (
        <section>
          <h3 className="text-sm uppercase tracking-widest text-muted mb-4">
            {t("sections.ecoSustainability")}
          </h3>
          <ul className="space-y-2">
            {ecoBenefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-muted">
                <svg
                  className="w-4 h-4 text-green-600 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Optional equipment */}
      {optionalEquipment && optionalEquipment.length > 0 && (
        <section>
          <h3 className="text-sm uppercase tracking-widest text-muted mb-4">
            {t("sections.optionalEquipment")}
          </h3>
          <ul className="space-y-2 text-sm text-muted">
            {optionalEquipment.map((item, index) => (
              <li key={index} className="flex items-center gap-3">
                <span className="text-[var(--foreground)]">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
