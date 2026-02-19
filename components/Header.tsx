
import Logo from "@/Assets/logo.svg";

function Header() {
  return (
    <header className="flex items-center px-10 bg-neutral-950 py-4 text-left">
        <img src={Logo.src} className="w-8 h-8 mr-3 mt-0.5 lg:w-8 lg:h-8" alt="Astro web logo" />
      <h1 className="text-2xl lg:text-2xl font-normal tracking-tight">
        Astro 
       <span className="font-black pl-0.5 text-neutral-700">web</span> 
      </h1>
    
     
    </header>
  );
}

export default Header;
