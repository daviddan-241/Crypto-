import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function Promote() {
  const nav = useNavigate();
  useEffect(() => { nav('/submit', { replace: true }); }, []);
  return null;
}
