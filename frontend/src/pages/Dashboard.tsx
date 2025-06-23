function Dashboard() {
  const token = localStorage.getItem('token');

  return (
    <div>
      <h2>Dashboard</h2>
      <p>JWT Token: {token}</p>
    </div>
  );
}

export default Dashboard;
