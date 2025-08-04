'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function MyProductList() {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      const user = auth.currentUser
      if (!user) return

      const snapshot = await getDocs(collection(db, 'users', user.uid, 'products'))
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setProducts(productList)
    }

    fetchProducts()
  }, [])

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">My Products</h2>
      <ul className="space-y-2">
        {products.map(product => (
          <li key={product.id} className="border p-2 rounded">
            <strong>{product.name}</strong> - ${product.price}
          </li>
        ))}
      </ul>
    </div>
  )
}
