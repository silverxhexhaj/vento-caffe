import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/profile";
import { getOrders } from "@/lib/actions/orders";
import { ProfileTabs } from "@/components/profile";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("profile.title"),
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  // Fetch profile and orders in parallel
  const [profileResult, ordersResult] = await Promise.all([
    getProfile(),
    getOrders(),
  ]);

  const profile = profileResult.profile;
  const email = profileResult.email || user.email || "";
  const orders = ordersResult.orders || [];

  // If profile doesn't exist yet (race condition), show a fallback
  if (!profile) {
    return (
      <div className="md:py-16 py-8">
        <div className="container">
          <p className="text-muted">{t("profile.notLoggedIn")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:py-16 py-8">
      <div className="container max-w-2xl">
        <div className="mb-8">
          <h1 className="text-h1 font-serif">{t("profile.title")}</h1>
        </div>

        <ProfileTabs profile={profile} email={email} orders={orders} />
      </div>
    </div>
  );
}
