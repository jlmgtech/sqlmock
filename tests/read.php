<?php

function execute_query(string $query): Generator
{
    // use CURL to GET localhost:2069/query/<urlencoded query here>/
    $sql = rawurlencode($query);
    $url = "http://localhost:2069/query/$sql";

    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($curl);
    if (curl_errno($curl))
    {
        $error_message = curl_error($curl);
        // Handle the error accordingly
        // Example: echo "cURL Error: " . $error_message;
    }
    curl_close($curl);
    if ($response !== false)
    {
        // Do something with the response data
        // Example: echo $response;
        $rsp = json_decode($response, true);
        if ($rsp["type"] === "error")
        {
            throw new \Exception("sql failed: " . $rsp["message"]);
        }
        else
        {
            foreach ($rsp["result"] as $row)
            {
                yield $row;
            }
        }
    }
    else
    {
        // Handle the case when the request fails
        // Example: echo "Request failed";
        throw new \Exception("sql request failed");
    }
}

function map_query(string $query, array $args): Generator
{
    foreach ($args as $key => $value)
        $query = str_replace("[$key]", $value, $query);
    yield from execute_query($query);
}

function list_query(string $query, ...$args): Generator
{
    $i = 0;
    foreach ($args as $arg)
        $query = str_replace("[".++$i."]", $arg, $query);
    yield from execute_query($query);
}

function ers_fetch_assoc($generator)
{
    if (!$generator->valid())
        return NULL;

    $result = $generator->current();
    $generator->next();
    return $result;
}


$q = list_query("" .
    "SELECT " .
        "actors.fname as actor_fname, ".
        "users.name as username, " .
        "users.id + actors.id as the_id " .
    "FROM users, actors " .
    "WHERE " .
        "actors.fname LIKE '[1]'" .
    "", "J%");

$i = 0;
while ($qread = ers_fetch_assoc($q))
{
    echo "QREAD $i = " . json_encode($qread, JSON_PRETTY_PRINT) . "\n\n";
    ++$i;
}
echo "$i results read\n";
