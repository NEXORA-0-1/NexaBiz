import { jwtDecode } from 'jwt-decode';

interface TokenData {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

function Dashboard() {
  const token = localStorage.getItem('token');

  if (!token) {
    return <p>Please log in first.</p>;
  }

  const decoded = jwtDecode<TokenData>(token);

  return (
    <div>
      <h2>Welcome to the Dashboard</h2>
      <p><strong>Logged in as:</strong> {decoded.userId}</p>
    </div>
  );
}

export default Dashboard;
