function Results({ items }) {
  if (!items.length) {
    return <p>No results yet.</p>;
  }

  return (
    <ul style={{ paddingLeft: "1rem" }}>
      {items.map((item) => (
        <li key={item.id} style={{ marginBottom: "1rem" }}>
          <strong>{item.title || "Untitled"}</strong>
          <div>Score: {Number(item.score).toFixed(4)}</div>
          <p>{item.content}</p>
        </li>
      ))}
    </ul>
  );
}

export default Results;
