export const OPEN_LEAD_FORM_EVENT = "open-lead-form";

export function openLeadForm(source = "cta") {
  window.dispatchEvent(new CustomEvent(OPEN_LEAD_FORM_EVENT, { detail: { source } }));
}
