module.exports = {
    prefix: 'tw-',
    corePlugins: {
        preflight: false,
    },
    content: [
        './src/**/*.{vue,js,ts,jsx,tsx}',
        './public/index.html',
    ],
    theme: {
        extend: {},
    },
    variants: {
        extend: {},
    },
    plugins: [],
}
