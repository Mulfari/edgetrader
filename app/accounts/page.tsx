"use client"

import { useState, useEffect } from "react"
import CreateSubAccount from "@/components/CreateSubAccounts"

interface SubAccount {
  id: string
  name: string
  exchange: string
  createdAt: string
}

export default function AccountPage() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    const fetchSubAccounts = async () => {
      try {
        const response = await fetch("/api/subaccounts")
        if (!response.ok) {
          throw new Error("Failed to fetch subaccounts")
        }
        const data = await response.json()
        setSubAccounts(data)
      } catch (err) {
        setError("An error occurred while fetching subaccounts")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubAccounts()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Account</h1>

      <h2 className="text-2xl font-semibold mb-4">Your Subaccounts</h2>
      {subAccounts.length === 0 ? (
        <p>You don't have any subaccounts yet.</p>
      ) : (
        <ul className="space-y-4">
          {subAccounts.map((subAccount) => (
            <li key={subAccount.id} className="border rounded-lg p-4 shadow-sm">
              <h3 className="text-xl font-medium">{subAccount.name}</h3>
              <p className="text-gray-600">Exchange: {subAccount.exchange}</p>
              <p className="text-gray-600">Created: {new Date(subAccount.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        {showCreateForm ? (
          <CreateSubAccount />
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Subaccount
          </button>
        )}
      </div>
    </div>
  )
}

