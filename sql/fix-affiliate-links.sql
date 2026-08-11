-- Wet London: clear affiliate links that earn nothing.
--
-- Audit of the 126 rows that had an affiliate_link:
--   75  were the bare string 'https://www.getyourguide.com'. Not a product page
--       and no partner id, so 'Book tickets' dropped visitors on GetYourGuide's
--       homepage and earned nothing.
--   11  carried '?affiliate=wetlondon' appended to the venue's own site. That
--       parameter is invented; no venue honours it, so it tracked nothing.
--   40  were real ticket pages on the venue's own site. Those are kept.
--
-- STEP 1: strip the invented parameter, leaving the working ticket URL.
UPDATE venues
SET affiliate_link = replace(affiliate_link, '?affiliate=wetlondon', '')
WHERE id IN (1, 2, 10, 17, 20, 21, 22, 31, 34, 35, 36);

-- STEP 2: clear the GetYourGuide homepage links. With affiliate_link empty the
-- Book tickets button falls back to a search for '<venue> London tickets', which
-- is more use to a visitor than a travel site's front page. These get replaced
-- with properly tracked links carrying partner id 3NBC6EH once the exact link
-- format is confirmed from the GetYourGuide link builder.
UPDATE venues
SET affiliate_link = NULL
WHERE id IN (1629, 1630, 1631, 1632, 1633, 1634, 1635, 1636, 1637, 1638, 1639, 1640, 1641, 1642, 1643, 1644, 1645, 1646, 1647, 1648, 1649, 1650, 1651, 1652, 1653, 1654, 1655, 1656, 1657, 1658, 1659, 1660, 1661, 1662, 1663, 1664, 1665, 1666, 1667, 1668, 1669, 1670, 1671, 1672, 1673, 1674, 1675, 1676, 1677, 1678, 1679, 1680, 1681, 1682, 1683, 1684, 1685, 1686, 1687, 1688, 1689, 1690, 1691, 1692, 1693, 1694, 1695, 1696, 1697, 1698, 1699, 1700, 1701, 1702, 1703);

-- STEP 3: confirm. Expect 40 remaining, none containing 'affiliate=wetlondon'
-- and none pointing at the GetYourGuide homepage.
SELECT count(*) AS links_remaining FROM venues WHERE affiliate_link IS NOT NULL;
SELECT count(*) AS should_be_zero FROM venues
WHERE affiliate_link LIKE '%affiliate=wetlondon%'
   OR trim(trailing '/' from affiliate_link) = 'https://www.getyourguide.com';
