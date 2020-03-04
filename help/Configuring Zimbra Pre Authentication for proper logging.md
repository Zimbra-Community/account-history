# Configuring Zimbra Pre Authentication for proper logging

To work around bug [https://bugzilla.zimbra.com/show_bug.cgi?id=96712](https://bugzilla.zimbra.com/show_bug.cgi?id=96712) you must use the SOAP API to implement pre-auth. Most people use REST API, but that does not log the users IP.

Here is a php example on how you can make a SOAP request, also note the extra header added for Zimbra X-Forwarded-For, that in this case is filled via another proxy (HTTP_X_FORWARDED_FOR).

         <?php
         validate the user somehow in your code than run log-me-in... change it!
         function log-me-in()
         {
         $domain = "https://mydomain.com";
         $preAuthKey ="my-key-here";
      
         $time = round(microtime(true) * 1000);
         $input_xml='<?xml version="1.0" encoding="utf-8"?>' .
                      '<soapenv:Envelope ' .
                          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' .
                          'xmlns:api="http://127.0.0.1/Integrics/Enswitch/API" ' .
                          'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ' .
                          'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">' .
                          '<soapenv:Body>' .
                          '<AuthRequest xmlns="urn:zimbraAccount">' .
                          '<account>'.$_SESSION['username'].'</account>' .
                          '<preauth timestamp="'.$time.'" expires="0">'.hmac_sha1($preAuthKey,$_SESSION['username'].'|name|0|'.$time).'</preauth>' .
                          '</AuthRequest>' .
                          '</soapenv:Body>' .
                      '</soapenv:Envelope>';
      
             //setting the curl parameters.
              $ch = curl_init();
              $ip = $_SERVER['HTTP_X_FORWARDED_FOR']; //header set from nginx1
              curl_setopt($ch, CURLOPT_URL, $domain."/service/soap/preauth");       
              curl_setopt($ch, CURLOPT_POSTFIELDS, $input_xml);
              curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
              curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 300);
              curl_setopt($ch, CURLOPT_HTTPHEADER, array("X-Forwarded-For: $ip"));
              curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);  //remove in prod
              curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);  //remove in prod
              $data = curl_exec($ch);
              print_r($data);
              curl_close($ch);
      
              $token = preg_match("/<authToken>.*?<\/authToken>/",$data,$matches);
              
              if(token)
              {           
                 if($matches[0])
                 {
                    $matches[0] = substr($matches[0], 11);//remove <authToken>
                    $matches[0] = substr($matches[0], 0, strlen($matches[0])-12);//remove </authToken>
                    header ("Location: ".$domain."/service/preauth?authtoken=$matches[0]");
                 }
                 else
                 {
                    header ("Location: ".$domain);
                 }
              }
              else
              {
                 header ("Location: ".$domain);
              }  
      }   
      
      
      function hmac_sha1($key, $data)
      {
          // Adjust key to exactly 64 bytes
          if (strlen($key) > 64) {
              $key = str_pad(sha1($key, true), 64, chr(0));
          }
          if (strlen($key) < 64) {
              $key = str_pad($key, 64, chr(0));
          }
      
          // Outter and Inner pad
          $opad = str_repeat(chr(0x5C), 64);
          $ipad = str_repeat(chr(0x36), 64);
      
          // Xor key with opad & ipad
          for ($i = 0; $i < strlen($key); $i++) {
              $opad[$i] = $opad[$i] ^ $key[$i];
              $ipad[$i] = $ipad[$i] ^ $key[$i];
          }
      
          return sha1($opad.sha1($ipad.$data, true));
      }
