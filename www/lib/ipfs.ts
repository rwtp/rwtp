export async function postJSONToIPFS(data: any, addDataTag: boolean = true) {
  let body = data;
  if (addDataTag) {
    body = {
      data: body,
    };
  }

  const result = await fetch('/api/uploadJson', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const { cid } = await result.json();
  return cid;
}

export async function postFileToIPFS(file: Buffer) {
  const result = await fetch('/api/uploadFile', {
    method: 'POST',
    body: file.toString('base64'),
  });
  const { cid } = await result.json();
  return cid;
}
