import { useEffect } from 'react';
import { Route, Switch } from 'wouter';
import { MainLayout } from '@/components/MainLayout';
import { SukunaGuide } from '@/components/SukunaGuide';
import { bootstrapAccount } from '@/lib/economy';
import Home from '@/pages/Home';
import Characters from '@/pages/Characters';
import Story from '@/pages/Story';
import Store from '@/pages/Store';
import Wallet from '@/pages/Wallet';
import Profile from '@/pages/Profile';
import Trade from '@/pages/Trade';
import BattleSetup from '@/pages/BattleSetup';
import BattleArena from '@/pages/BattleArena';
import Admin from '@/pages/Admin';
import Referrals from '@/pages/Referrals';
import Clans from '@/pages/Clans';
import RaidBoss from '@/pages/RaidBoss';
import UndergroundArena from '@/pages/UndergroundArena';
import Ledger from '@/pages/Ledger';
import TengenAI from '@/pages/TengenAI';
import Support from '@/pages/Support';
import Register from '@/pages/Register';
import KYC from '@/pages/KYC';
import FAQ from '@/pages/FAQ';
import MobaLegends from '@/pages/MobaLegends';
import { MobaBattlefield } from '@/components/MobaBattlefield';
import { RosterViewer } from '@/components/RosterViewer';
import { RankProgression } from '@/components/RankProgression';
import { SuperAdmin } from '@/components/SuperAdmin';

function App() {
  useEffect(() => { bootstrapAccount(); }, []);

  return (
    <>
      <Switch>
        <Route path="/trade" component={Trade} />
        <Route path="/admin" component={Admin} />
        <Route path="/super-admin" component={SuperAdmin} />
        <Route path="/referrals" component={Referrals} />
        <Route path="/clans" component={Clans} />
        <Route path="/raid" component={RaidBoss} />
        <Route path="/arena" component={UndergroundArena} />
        <Route path="/ledger" component={Ledger} />
        <Route path="/tengen-ai" component={TengenAI} />
        <Route path="/support" component={Support} />
        <Route path="/register" component={Register} />
        <Route path="/kyc" component={KYC} />
        <Route path="/faq" component={FAQ} />
        <Route path="/moba" component={MobaLegends} />
        <Route path="/moba/battle" component={MobaBattlefield} />
        <Route path="/roster" component={RosterViewer} />
        <Route path="/ranks" component={RankProgression} />
        <Route path="/battle/arena" component={BattleArena} />
        <Route path="/story" component={Story} />
        <Route path="/battle" component={BattleSetup} />
        <MainLayout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/characters" component={Characters} />
            <Route path="/store" component={Store} />
            <Route path="/wallet" component={Wallet} />
            <Route path="/profile" component={Profile} />
            <Route>
              <div className="max-w-md mx-auto px-4 py-20 text-center text-zinc-500">
                <p className="font-display text-xl">404 — Domain Collapsed</p>
                <p className="text-sm mt-2">This page was dismantled.</p>
              </div>
            </Route>
          </Switch>
        </MainLayout>
      </Switch>
      <SukunaGuide />
    </>
  );
}

export default App;
