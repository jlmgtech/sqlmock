<?php


function ers_query(string $query, string ...$args): Generator
{
    // use CURL to GET localhost:2069/query/<urlencoded query here>/
    $sql = rawurlencode($query);
    $url = "http://localhost:2069/query/$sql";

    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($curl);
    if(curl_errno($curl)){
        $error_message = curl_error($curl);
        // Handle the error accordingly
        // Example: echo "cURL Error: " . $error_message;
    }
    curl_close($curl);
    if($response !== false) {
        // Do something with the response data
        // Example: echo $response;
        $rsp = json_decode($response, true);
        if ($rsp["type"] === "error") {
            throw new \Exception("sql failed: " . $rsp["message"]);
        } else {
            foreach ($rsp["result"] as $row) {
                yield $row;
            }
        }
    } else {
        // Handle the case when the request fails
        // Example: echo "Request failed";
        throw new \Exception("sql request failed");
    }
}

function fetch_assoc($generator)
{
    if (!$generator->valid()) {
        return NULL;
    }

    $result = $generator->current();
    $generator->next();
    return $result;
}


$q = ers_query("SELECT actors.fname as actor_fname, users.name as username, users.id FROM users, actors WHERE actors.fname LIKE 'J%'");
while ($qread = fetch_assoc($q)) {
    echo "READ: " . json_encode($qread, JSON_PRETTY_PRINT) . "\n";
}
