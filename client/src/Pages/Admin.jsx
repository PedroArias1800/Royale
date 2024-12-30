import React, { useEffect, useState } from 'react'
import { getParfumsRequest, getTypesRequest, getBodiesRequest, getBrandsRequest, getVersionsRequest } from '../api/Admin.api.js'

export const Admin = () => {

    const [parfums, setParfums] = useState([])
    const [types, setTypes] = useState([])
    const [bodies, setBodies] = useState([])
    const [brands, setBrands] = useState([])
    const [versions, setVersions] = useState([])

    useEffect(() => {
        async function loadParfums() {
            const response = await getParfumsRequest()
            setParfums(response.data)
        }
        async function loadTypes() {
            const response = await getTypesRequest()
            setTypes(response.data)
        }
        async function loadBodies() {
            const response = await getBodiesRequest()
            setBodies(response.data)
        }
        async function loadBrands() {
            const response = await getBrandsRequest()
            setBrands(response.data)
        }
        async function loadVersions() {
            const response = await getVersionsRequest()
            setVersions(response.data)
        }
        loadParfums()
        loadTypes()
        loadBodies()
        loadBrands()
        loadVersions()
    }, [])

  return (
    <div>
        <div>Admin</div>
        <h3>Perfumes</h3>
        {
            parfums.forEach(item => {
                <p>{item.title}</p>
            })
        }
    </div>
  )
}