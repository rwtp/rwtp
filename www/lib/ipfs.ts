export async function postToIPFS(data: any) {
  const result = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: data,
    }),
  });
  const { cid } = await result.json();
  return cid;
}
