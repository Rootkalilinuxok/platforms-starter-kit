module.exports = async function getRequestConfig({locale}) {
  const {getDictionary} = await import('../lib/i18n/get-dictionary');
  const typedLocale = locale ?? 'en';

  return {
    locale: typedLocale,
    messages: await getDictionary(typedLocale)
  };
};
