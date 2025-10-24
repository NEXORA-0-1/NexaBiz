import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const query = `
      [out:json][timeout:25];
      area["name"="Sri Lanka"]["boundary"="administrative"]->.searchArea;
      node["shop"="clothes"](area.searchArea);
      out body;
    `

    const url = 'https://overpass-api.de/api/interpreter'

    const response = await fetch(url, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const data = await response.json()

    const customers = data.elements
      .map((el: any) => {
        const tags = el.tags || {}

        return {
          name: tags.name || 'Unnamed Store',
          type: tags.shop || 'Clothing Store',
          // try to capture all address fields
          city:
            tags['addr:city'] ||
            tags['addr:suburb'] ||
            tags['addr:district'] ||
            tags['addr:place'] ||
            tags['is_in'] ||
            '',
          address: [
            tags['addr:housenumber'],
            tags['addr:street'],
            tags['addr:postcode'],
            tags['addr:region'],
          ]
            .filter(Boolean)
            .join(', '),

          // add more possible contact info
          phone:
            tags['contact:phone'] ||
            tags['phone'] ||
            tags['contact:mobile'] ||
            tags['mobile'] ||
            '',
          email: tags['contact:email'] || tags['email'] || '',
          website: tags['website'] || tags['contact:website'] || '',
          facebook: tags['contact:facebook'] || '',
          instagram: tags['contact:instagram'] || '',
          lat: el.lat,
          lon: el.lon,
        }
      })
      // filter: only if location info exists
      .filter((c: any) => c.city && c.city.trim() !== '')

    return NextResponse.json(customers)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to fetch data from Overpass API' },
      { status: 500 }
    )
  }
}
