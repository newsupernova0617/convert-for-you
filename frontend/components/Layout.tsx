import Head from 'next/head';
import { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import clsx from 'clsx';

interface LayoutProps {
  children: ReactNode;
}

const locales = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' }
];

export function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const switchLocale = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
  };

  return (
    <>
      <Head>
        <title>Convert For You</title>
        <meta name="description" content={t('description')} />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
            <Link href="/">
              <span className="text-2xl font-bold tracking-tight text-white">Convert For You</span>
            </Link>
            <div className="flex items-center gap-4 text-sm text-slate-200">
              <span className="hidden sm:block">{t('privacy')}</span>
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20">
                    <GlobeAltIcon className="h-5 w-5" />
                    {locales.find((locale) => locale.code === router.locale)?.label ?? 'English'}
                  </Menu.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right divide-y divide-white/10 rounded-lg bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-1">
                      {locales.map((locale) => (
                        <Menu.Item key={locale.code}>
                          {({ active }) => (
                            <button
                              type="button"
                              className={clsx(
                                'flex w-full items-center rounded-md px-3 py-2 text-sm',
                                active ? 'bg-primary-500/20 text-white' : 'text-slate-100'
                              )}
                              onClick={() => switchLocale(locale.code)}
                            >
                              {locale.label}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
              <Link
                href="#premium"
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 hover:bg-primary-400"
              >
                {t('premiumCta')}
              </Link>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} Convert For You. All rights reserved. Files auto-delete after 24h.
            </p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
