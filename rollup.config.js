const buble = require('rollup-plugin-buble');

module.exports = {
  onwarn(str) {
    if (!/Treating/.test(str)) {
      console.error(str);
    }
  },
  plugins: [
    buble()
  ]
};
