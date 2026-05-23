import { getSettingValue } from "@/lib/actions/settings";
import { ContentEditor } from "@/components/admin/content-editor";
import type {
  HeroSettings,
  AboutSettings,
  ContactSettings
} from "@/lib/queries/settings";

export const dynamic = "force-dynamic";

export default async function ContentAdminPage() {
  const [hero, about, contact] = await Promise.all([
    getSettingValue("hero") as Promise<HeroSettings | null>,
    getSettingValue("about") as Promise<AboutSettings | null>,
    getSettingValue("contact") as Promise<ContactSettings | null>
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-charcoal">
          Contenido del sitio
        </h1>
        <p className="text-charcoal-soft mt-1">
          Edita los textos y fotos del sitio público. Los cambios se reflejan al instante.
        </p>
      </header>
      <ContentEditor hero={hero} about={about} contact={contact} />
    </div>
  );
}
