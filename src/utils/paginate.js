/*
Takes the data to paginate, the callback
to perform per slice of data and an option page size.
*/

export const paginate = async (data, callback, size = 50) => {
  const slice = data.splice(0, size);
  if (slice.length === 0) return;
  await callback(slice);
  return paginate(data, callback, size);
};
