import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Layout } from '../components/Layout';

export default function PrivacyPage() {
  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-6 py-20 text-slate-100">
        <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-6 text-sm text-slate-200">
          Convert For You deletes uploaded files after 24 hours, encrypts data in transit and at rest, and never shares content
          with third parties outside of aggregated analytics.
        </p>
        <p className="mt-4 text-sm text-slate-200">
          Replace this placeholder copy with your full legal policy covering GDPR/CCPA disclosures, contact information, and data
          retention practices.
        </p>
      </section>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common']))
  }
});
