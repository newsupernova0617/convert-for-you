import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Layout } from '../components/Layout';

export default function TermsPage() {
  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-6 py-20 text-slate-100">
        <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
        <p className="mt-6 text-sm text-slate-200">
          Use this page to outline acceptable usage, limits on automated scraping, premium billing conditions, and intellectual
          property ownership.
        </p>
        <p className="mt-4 text-sm text-slate-200">
          The current copy is a placeholder to be replaced by your legal team before launch.
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
