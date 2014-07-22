#include <cstdio>
#include <iostream>
#include <cassert>
#include <cstdlib>
#include <sstream>
#include <map>

int main(int argc,char** argv)
{
   std::string s;
   std::cout<<"please enter url parameter like a=1&b=2";
   std::cin >> s;
   if(*s.end()!='&'){
       s.push_back('&');
   }
   std::istringstream ss(s);
   ss>>std::noskipws;
   std::string word;
   std::string par_name;
   std::string par_value;
   std::map<std::string,std::string> d;
   //par_name.reserve(50);
   //par_value.reserve(50);
   char ch;
   bool val = false;
   while (ss>>ch){
      if (ch=='='){
         val = true;
         continue;
      }
      if (ch=='&'){
         if(par_name.length() >0 && par_value.length() >0 ){
            d.insert(std::pair<std::string,std::string>(par_name,par_value));
         }
         par_name.clear();
         par_value.clear();
         val=false;
         continue;
      }
      if(val){
         par_value.push_back(ch);
      }
      else{
         par_name.push_back(ch);
      }
   }

   for(std::map<std::string,std::string>::iterator iter = d.begin();d.end()!=iter;++iter){
       std::cout<<iter->first<<" "<<iter->second<<std::endl;
   }

	return 0;
}


