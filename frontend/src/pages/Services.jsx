import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function Services() {
  const nav = useNavigate();
  useEffect(() => { nav('/listed', { replace: true }); }, []);
  return null;
}
