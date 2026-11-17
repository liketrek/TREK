package com.liketrek.trek.widget

/**
 * The world as 76 by 34 dots from 80 degrees north to 58 south, each the ISO
 * code of the country under it, ".." for sea. The same grid as the iOS widget
 * (client/ios/App/TREKWidgets/WorldGrid.swift, generated from
 * server/assets/atlas/admin0.geojson.gz); copy it over when that one changes.
 */
object WorldGrid {
    const val COLUMNS = 76
    val ROWS: List<String> = listOf(
        "........................CACACA..CACACACACACA..GLGLGLGLGLGLGLGLGLGLGL............NONONO..................RU..........RURURU..............................",
        "......................CACACACACA..CACACACACA........GLGLGLGLGLGLGLGL..............................RURU....RURURURURURURURURURURURURU..RURURU............",
        "......USUSUSUSUSCACACACACACACACACACACACACACACACA....GLGLGLGLGLGLGL................NONONORURU....RURU..RURURURURURURURURURURURURURURURURURURURURURURURURU",
        "RURU..USUSUSUSUSCACACACACACACACACACACACACACACACACA....GLGLGLGL....ISIS..........NOSESEFIRURURURURURURURURURURURURURURURURURURURURURURURURURURURURURURURU",
        "......USUSUSUSUSCACACACACACACACACACACA....CACACACA....GLGL....................NONOSEFIFIRURURURURURURURURURURURURURURURURURURURURURURURURURURURURURURURU",
        "........USUS......USCACACACACACACACACACA..CACACACA........................GB..NOSESELVLVRURURURURURURURURURURURURURURURURURURURURURURURU......RURU......",
        "......US............CACACACACACACACACACACACACACACACA....................IEGBGBNLDEPLPLBYBYRURURURURURUKZKZRURURURURURURURURURURURURURURURU....RU........",
        "......................CACACACACACACACACACACACACACACACA....................FRFRDEDECZPLUAUAUARURUKZKZKZKZKZKZKZKZRUMNMNMNMNRUMNCNCNRURURURU..............",
        "........................USUSUSUSUSUSUSUSCACACAUSCA........................FRFRITITHRROROMDUARURURUKZKZKZKZKZKZCNCNMNMNMNMNMNCNCNCNCNRU..................",
        "......................USUSUSUSUSUSUSUSUSUSUSUS..........................ESESES..ITITALBGTRTRTRGEAZTMTMUZKZKGKGCNCNCNCNCNCNCNCNCNCNCN..JPJP..............",
        "........................USUSUSUSUSUSUSUSUSUS............................ESESDZDZ....GRTRTRTRTRIRIRIRIRTMTJTJCNCNCNCNCNCNCNCNCNCNKPKR..JP................",
        "..........................USUSUSUSUSUSUSUSUS............................MAMADZDZTN..LY....LBIQIQIRIRIRAFAFPKINCNCNCNCNCNCNCNCNCNKRJPJP..................",
        "..........................MXMXMXMXUSUS..US............................MADZDZDZDZLYLYLYEGEGSASAIQIRIRIRPKPKININNPCNCNCNCNCNCNCNCN........................",
        "............................MXMXMXUS....US..........................EHEHMRDZDZDZLYLYLYEGEGSASASASAAEIRPKPKINININININMMCNCNCNCNCN........................",
        "..............................MXMXMX..MXCUCUBS......................MRMRMRMLDZDZNETDLYSDSDSDSASASASAOM..INININININMMMMLAVNCN............................",
        "................................MXMXMXMX..JM........................MRMRMRMLMLNENETDTDSDSDSDERYEYEOM......INININ....MMTHVN....PH........................",
        "....................................GTSVNI....VE....................SNSNMLBFNENENGTDTDSDSDSDETYEYE........ININ......MMTHKH....PH........................",
        "........................................CRPACOVEVEVE..................SLCIGHBJNGNGTDCFSSSSETETSOSO..........IN....IN....VN......PH......................",
        "..........................................COCOCOVEGYSR..................CICI..NGCMCFCFCDSSKEETSOSO..................IDMY....MY..ID......................",
        "..........................................ECCOBRBRBRBRBR........................GACGCDCDUGKEKESO......................ID..IDIDID........................",
        "..........................................ECPEBRBRBRBRBRBRBR....................CGCDCDCDBITZKE........................IDIDIDIDID..IDIDIDPG..PG..........",
        "..........................................PEBRBRBRBRBRBRBRBRBR..................AOAOCDCDTZTZTZ..........................IDIDID........IDPGPGPG..........",
        "..........................................PEPEBOBRBRBRBRBRBRBR....................AOAOCDZMTZMZKM..................................AUAU....PG............",
        "............................................PEBOBOBRBRBRBRBR....................AOAOAOZMMZMZMZMGMG..............................AUAUAU..AU..............",
        "..............................................CLBOPYBRBRBRBR....................NANABWBWZWMZ..MGMG............................AUAUAUAUAUAUAU....FR......",
        "..............................................CLARPYBRBRBR........................NABWBWZAMZ..MG............................AUAUAUAUAUAUAUAU............",
        "..............................................ARARARBRBR..........................NAZAZAZA..................................AUAUAUAUAUAUAUAUAU..........",
        "..............................................ARARARUY............................ZAZAZAZA..................................AUAUAUAUAUAUAUAUAU..........",
        "............................................CLARARARUY..............................ZA......................................AU........AUAUAU............",
        "............................................CLARARAR....................................................................................AU............NZ",
        "............................................CLARAR......................................................................................AU........NZNZ..",
        "............................................CLAR........................................................................................................",
        "............................................CLAR........................................................................................................",
        "..............................................CL........................................................................................................",
    )

    /** The country code of a dot, null for sea. */
    fun code(row: Int, column: Int): String? {
        val code = ROWS[row].substring(column * 2, column * 2 + 2)
        return if (code == "..") null else code
    }
}
