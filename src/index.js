
const { performance } = require('perf_hooks')
const { $fetch } = require('ohmyfetch')

const queryGroups = [
  [
    'search[title]',
    [
      'アルゴリズム',
      'あルごリずむ',
      'Algorithm',
      'ALgoRiThm'
    ]
  ],
  [
    'search[teacher_name]',
    [
      '萩野',
      'はぎの',
      'Hagino',
      'HAGINO',
    ]
  ],
  [
    'search[summary]',
    [
      'いろはにほへと ちりぬるを 色は匂へど 散りぬるを',
      'The quick brown fox jumps over the lazy dog.'
    ]
  ],
]

const idGen = (function *() {
  let i = 0
  while (true) yield i++
})()

const benchmark = async (label, callback) => {
  const id = idGen.next().value
  const a = `${label} - start - ${id}`
  const b = `${label} - end - ${id}`
  const name = `${label} - name - ${id}`

  const [url, query] = callback()
  performance.mark(a)
  await $fetch(url)
  performance.mark(b)
  performance.measure(name, a, b)

  const duration = performance.getEntriesByName(name)[0].duration

  return { query, duration }
}

const Coursum = (query) => {
  const url = `http://133.27.114.155:3000/search?query=${query}`

  return [url, query]
}

const SyllabusSearch = (param) => {
  const searchParams = new URLSearchParams({
    "locale": "ja",
    "search[title]": "",
    "search[year]": "2022",
    "search[semester]": "",
    "search[sub_semester]": "",
    "search[teacher_name]": "",
    "search[sfc_guide_title]": "",
    "search[summary]": "",
    "search[objective]": "",
    "button": "",
    ...param
  })
  const url = `https://syllabus.sfc.keio.ac.jp/courses?${searchParams.toString()}`
  const query = Object.values(param)[0]

  return [url, query]
}


;(async () => {
  const CoursumResult = (
    (await Promise.allSettled(
      queryGroups.flatMap(([_key, queries]) => queries)
        .map((query) => benchmark('Coursum', () => Coursum(query)))
    )).filter(({ status }) => status === 'fulfilled')
      .map(({ value }) => value)
  )

  const SyllabusSearchResult = (
    (await Promise.allSettled(
      queryGroups.flatMap(([key, queries]) => queries.map((query) => ({ [key]: query })))
        .map((param) => benchmark('SyllabusSearch', () => SyllabusSearch(param)))
    ))
    .filter(({ status }) => status === 'fulfilled')
      .map(({ value }) => value)
  )

  const len = 7

  console.table(
    CoursumResult.reduce((obj, cur, idx) => {
      const CoursumDuration = cur.duration
      const SyllabusSearchDuration = SyllabusSearchResult[idx].duration
      const DurationDiff = (CoursumDuration - SyllabusSearchDuration)

      return {
        ...obj,
        ...{
          [cur.query]: {
            Coursum: CoursumDuration.toFixed(2).padStart(len) + ' ms',
            SyllabusSearch: SyllabusSearchDuration.toFixed(2).padStart(len) + ' ms',
            Diff: DurationDiff.toFixed(2).padStart(len) + ' ms',
          }
        }
      }
    }, {})
  )
})()
