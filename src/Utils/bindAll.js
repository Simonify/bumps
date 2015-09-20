export default function bindAll(ctx, arr) {
  for (let i = 0; i < arr.length; i++) {
    if (typeof arr[i] === 'string' && arr[i].length) {
      ctx[arr[i]] = ctx[arr[i]].bind(ctx);
    } else {
      console.warn('invalid string provided to #bindAll')
    }
  }
}
