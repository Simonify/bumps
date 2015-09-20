export default function bindAll(ctx, arr) {
  for (let i = 0; i < arr.length; i++) {
    ctx[arr[i]] = ctx[arr[i]].bind(ctx);
  }
}
