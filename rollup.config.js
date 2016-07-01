export default {
  onwarn(str) {
    if (!/Treating/.test(str)) {
      console.error(str);
    }
  },
  format: 'cjs'
}
